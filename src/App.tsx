import { useState, useCallback } from 'react'
import './App.css'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import JsonPointer from 'json-pointer'
import jsYaml from 'js-yaml'

function App() {
const [url, setUrl] = useState('https://httpbin.org/anything#/headers/Accept')
const [report, setReport] = useState(null)
const [error, setError] = useState(null)
const [status, setStatus] = useState(null)
const [jsonPointer, setJsonPointer] = useState('')
const [isLoading, setIsLoading] = useState(false)

const reportJsonPointer = useCallback((doc) => {
  let yaml,json, jsonError, yamlError
  try {
    yaml = jsYaml.load(doc)
  } catch(e) {
    setError('YAML Error: ' + e)
    return
  }
  try {
    json = JSON.parse(doc)
  } catch(e) {
    jsonError = e
  }

  const [docUrl, pointer=''] = url.split('#')
  const tokens = JsonPointer.parse(pointer)
  const pointerReport = [{
    pointer: '/',
      exists: !!yaml,
      value: yaml,
  }]

  for(let i = 0; i < tokens.length; i++) {
    let nextPointer = JsonPointer.compile(tokens.slice(0, i+1))
      let exists = JsonPointer.has(yaml, nextPointer)
      pointerReport.push({
	pointer: nextPointer,
	exists, 
	value: exists ? JsonPointer.get(yaml, nextPointer) : undefined
      })
      }

    const lastPointer = pointerReport[pointerReport.length - 1]

    
    const reversed = [...pointerReport]
    reversed.reverse()
    const lastValidPointer = reversed.find(a => a.exists)

    setReport({
      isValidJSON: !jsonError,
      isValidYAML: !!yaml,
      docUrl,
      pointerReport,
      pointer: lastPointer.pointer,
      value: lastPointer.value,
      exists: lastPointer.exists,
      lastValidPointer,
      doc,
      body: yaml,
    })
    
  }, [url])

  const fetchTheUrl = useCallback(() => {
    setIsLoading(true)
    setError(null)
    setReport(null)
    fetch(url).then((res) => {
      setStatus(res.status)
      setIsLoading(false)
      return res.text().then(text => {
	reportJsonPointer(text)
      })
    }).catch(error => {
      setIsLoading(false)
      if (error.message === 'Failed to fetch') {
	setError(new Error('Failed to fetch: Possibly due to CORS issues'))
      } else {
	setError(new Error('Fetch error: ' + error))
      }
    })
    
  }, [url])

  return (
    <>
      <div className="mt-24" >
	<h1 className="text-2xl" >Figure out if your $ref is wrong</h1>
	<p className="mt-4" >Paste your URL + JSON Pointer here</p>
	<form className="mt-2 flex space-x-4"  onSubmit={(e) => {
	  e.preventDefault()
	  fetchTheUrl()
	}}>
	  <Input className="" onChange={(e) => setUrl(e.target.value)} value={url}/>
	  <Button type="submit" className="px-12" >Fetch</Button>
	</form>
      </div>

      <div className="mt-4 py-2" >
	{report ? (
	  <div className="px-4 py-2 text-gray-800 bg-gray-50" >
	    <h2 className="text-2xl" >Report on </h2>
	    <div className="font-mono" >
	      <span className="text-purple-800" >{report.docUrl}</span>
	      <span className="text-green-800 font-bold" >#</span>
	      <span className="font-bold" >{report.pointer} </span>
	    </div>
	    <div className="mt-4 flex space-x-1" >
	      <Badge>{status}</Badge>
	      <Badge> {report.isValidYAML ? 'Valid ' : 'Invalid '} YAML </Badge> 
	      <Badge> {report.isValidJSON ? 'Valid ' : 'Invalid '} JSON </Badge> 
	    </div>

	    <div className="mt-4 border-l-8 pl-2" >
	      {report.pointerReport.map(pReport => (
		<div className="flex items-center space-x-4" >
		  <div>
		    {pReport.exists? (
		      <Badge className="bg-green-700" >Exists</Badge>
		    ) : (
		      <Badge variant="destructive">Missing</Badge>
		    )}
		  </div>
		  <div className="font-mono font-bold" >
		    {pReport.pointer}
		  </div>
		</div>
	      ))}
	    </div>

	    {report.exists ? (
	      <div className="mt-8" >
		<h2>Value of <span className="font-bold"> {report.pointer} </span> </h2>
		<pre className="mt-4 bg-green-400 p-4" >{JSON.stringify(report.value, null, 2)}</pre>
	      </div>
	    ) : (
	      <div className="mt-8" >
		<h2>Value of <span className="font-bold"> {report.lastValidPointer.pointer} </span> </h2>
		<pre className="mt-4 bg-red-400 p-4" >{JSON.stringify(report.lastValidPointer.value, null, 2)}</pre>
	      </div>
	    )}

	  </div>
	) : (
	  <p>
	    {isLoading ? 'Loading...' : 'No report (yet)'}
	  </p>
	)}

	{error && (
	  <pre className="bg-red-50 border-red-500 px-4 mt-4" >{error+''}</pre>
	)}
      </div>

    </>
  )
}

export default App
