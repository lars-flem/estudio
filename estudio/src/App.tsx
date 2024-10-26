import React, { useState, useRef } from 'react';
import './App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy } from '@fortawesome/free-solid-svg-icons';

const App: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const[translatedText, setTranslatedText]=useState('');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  
  const recognitionRef = useRef<any>(null); // Use 'any' for the SpeechRecognition type

  // Initialize the SpeechRecognition API (with browser support check)
  const initializeRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Web Speech API not supported in this browser. Use Chrome or another compatible browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES'; 
    recognition.interimResults = true; 
    recognition.continuous = true; 
    recognition.maxAlternatives = 3;

    let translationBuffer = '';

    // Event handler for receiving results
    recognition.onresult = async (event: any) => {
      let tempInterimTranscript = '';
      let finalTranscription = '';




      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscription += transcript + ' ';
          translationBuffer += transcript + ' '; // Add to buffer
        } else {
          tempInterimTranscript += transcript;
        }
      }

      setTranscript((prev) => prev + finalTranscription); // Update final transcript
      setInterimTranscript(tempInterimTranscript); // Update interim transcript

      if(translationBuffer.length > 30) {
        const translation = await translateText(finalTranscription,'en','es');
        setTranslatedText(translation); // Display translation in the app
        translationBuffer='';
      }
    };
    // Event handler for any errors
      recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
    };

    recognitionRef.current = recognition;
  };

  // Start recording
  const startRecording = () => {
    if (!recognitionRef.current) {
      initializeRecognition();
    }
    recognitionRef.current?.start();
    setIsRecording(true);
  };

  // Pause recording
  const pauseRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  const resetTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
    setTranslatedText('');
  };


  const downloadTranscript = () => {
    const element = document.createElement('a');
    const file = new Blob([transcript], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'transcription.txt';
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  };

  // Function to translate text using Google Translate API
const translateText = async (text: string, targetLanguage: string, sourceLanguage:string) => {
  const apiKey = process.env.REACT_APP_GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) {throw new Error('Google Translate API key not provided')}
  
  const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: text,
      target: targetLanguage,
      source: sourceLanguage,
    }),
  });

  const result = await response.json();
  return result.data.translations[0].translatedText;
};


  return (
    <div className="App">
      <h1>Estudio📚✏️</h1>
      <button onClick={startRecording} disabled={isRecording}>
        Start recording
      </button>
      <button onClick={pauseRecording} disabled={!isRecording}>
        Pause recording
      </button>
      <button onClick={resetTranscript} >
        Reset transcript
      </button>
      <button onClick={downloadTranscript} disabled={!transcript}>
        Download txt file
      </button>
      <div className='textPart'>
          <h2>Transcription:</h2>
          <div className='translation'>
            <em>{translatedText}</em>  
          </div>
          <div className='tempTranscript'>
            <em>{interimTranscript}</em>
          </div>
          <div className='transcript border border-gray-300 rounded-lg mx-auto bg-gray-50'>
          <button
              onClick={() => navigator.clipboard.writeText(transcript)}
              className="bg-white absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              aria-label="Copy to clipboard"
          >
            <FontAwesomeIcon icon={faCopy} />
          </button>
            <p>{transcript}</p>
        </div>
      </div>
    </div>
  );
};

export default App;

