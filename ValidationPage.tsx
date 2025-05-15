import { useState, useEffect } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Ticket as TicketIcon, User } from 'lucide-react';
import { validateTicket, getTicketById, getUserById, getEventById } from '../utils/storage';

export default function ValidationPage() {
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [validationCode, setValidationCode] = useState('');
  const [ticketId, setTicketId] = useState('');
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    message: string;
    ticket?: any;
    event?: any;
    user?: any;
  } | null>(null);

  useEffect(() => {
    // Initialize scanner
    const newScanner = new Html5Qrcode('reader');
    setScanner(newScanner);

    // Cleanup on unmount
    return () => {
      if (newScanner && newScanner.getState() === Html5QrcodeScannerState.SCANNING) {
        newScanner.stop().catch(error => console.error(error));
      }
    };
  }, []);

  const startScanner = async () => {
    if (!scanner) return;

    const qrCodeSuccessCallback = (decodedText: string) => {
      try {
        const data = JSON.parse(decodedText);
        if (data.ticketId && data.code) {
          setTicketId(data.ticketId);
          setValidationCode(data.code);
          stopScanner();
          validateTicketCode(data.ticketId, data.code);
        }
      } catch (error) {
        console.error("Error parsing QR code:", error);
      }
    };

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    try {
      setIsScanning(true);
      await scanner.start(
        { facingMode: "environment" },
        config,
        qrCodeSuccessCallback
      );
    } catch (error) {
      console.error("Error starting scanner:", error);
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scanner && scanner.getState() === Html5QrcodeScannerState.SCANNING) {
      try {
        await scanner.stop();
        setIsScanning(false);
      } catch (error) {
        console.error("Error stopping scanner:", error);
      }
    }
  };

  const validateTicketCode = (id: string, code: string) => {
    const isValid = validateTicket(id, code);
    
    if (isValid) {
      const ticket = getTicketById(id);
      const user = ticket ? getUserById(ticket.userId) : null;
      const event = ticket ? getEventById(ticket.eventId) : null;
      
      setValidationResult({
        success: true,
        message: "Ticket successfully validated!",
        ticket,
        user,
        event
      });
    } else {
      const ticket = getTicketById(id);
      
      let message = "Invalid ticket code.";
      if (ticket) {
        if (ticket.status === 'used') {
          message = "This ticket has already been used.";
        } else if (ticket.validationCode !== code) {
          message = "Incorrect validation code.";
        }
      }
      
      setValidationResult({
        success: false,
        message
      });
    }
  };

  const handleManualValidation = () => {
    if (ticketId && validationCode) {
      validateTicketCode(ticketId, validationCode);
    }
  };

  const resetValidation = () => {
    setValidationResult(null);
    setTicketId('');
    setValidationCode('');
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-blue-500 text-white p-6">
            <h1 className="text-2xl font-bold mb-2">Ticket Validation</h1>
            <p>Scan or enter ticket details to validate attendance</p>
          </div>
          
          <div className="p-6">
            {validationResult ? (
              <div className={`p-4 rounded-md ${validationResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'} mb-6`}>
                <div className="flex items-start">
                  <div className={`flex-shrink-0 ${validationResult.success ? 'text-green-500' : 'text-red-500'}`}>
                    {validationResult.success ? (
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <h3 className={`text-lg font-medium ${validationResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {validationResult.success ? 'Success' : 'Error'}
                    </h3>
                    <div className={`mt-2 text-sm ${validationResult.success ? 'text-green-700' : 'text-red-700'}`}>
                      <p>{validationResult.message}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
            
            {!validationResult ? (
              <>
                <div className="mb-6">
                  <div id="reader" className="w-full"></div>
                  
                  <div className="flex justify-center mt-4">
                    {!isScanning ? (
                      <button
                        className="btn btn-primary"
                        onClick={startScanner}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                        </svg>
                        Scan QR Code
                      </button>
                    ) : (
                      <button
                        className="btn btn-outline"
                        onClick={stopScanner}
                      >
                        Stop Scanning
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Manual Validation</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ticket ID
                      </label>
                      <input
                        type="text"
                        value={ticketId}
                        onChange={(e) => setTicketId(e.target.value)}
                        placeholder="Enter ticket ID"
                        className="input w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Validation Code
                      </label>
                      <input
                        type="text"
                        value={validationCode}
                        onChange={(e) => setValidationCode(e.target.value.toUpperCase())}
                        placeholder="Enter validation code"
                        className="input w-full uppercase"
                      />
                    </div>
                    
                    <button
                      className="btn btn-primary w-full"
                      onClick={handleManualValidation}
                      disabled={!ticketId || !validationCode}
                    >
                      Validate Ticket
                    </button>
                  </div>
                </div>
              </>
            ) : validationResult.success && validationResult.event && validationResult.user ? (
              <div className="space-y-6">
                <div className="flex items-center justify-center">
                  <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                    <TicketIcon className="h-10 w-10 text-green-600" />
                  </div>
                </div>
                
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-1">{validationResult.event.title}</h3>
                  <p className="text-gray-600">
                    {new Date(validationResult.event.date).toLocaleDateString()} at {validationResult.event.time}
                  </p>
                </div>
                
                <div className="border-t border-b border-gray-200 py-4">
                  <div className="flex items-center">
                    <div className="mr-4">
                      <User className="h-12 w-12 text-gray-400 bg-gray-100 p-2 rounded-full" />
                    </div>
                    <div>
                      <h4 className="font-medium">{validationResult.user.name}</h4>
                      <p className="text-gray-600 text-sm">{validationResult.user.email}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ticket Type</span>
                    <span className="font-medium">
                      {(() => {
                        const ticketType = validationResult.event.ticketTypes.find(
                          (t: any) => t.id === validationResult.ticket.ticketTypeId
                        );
                        return ticketType ? ticketType.name : 'Unknown';
                      })()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ticket ID</span>
                    <span className="font-mono text-sm">{validationResult.ticket.id.substring(0, 8)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Validation Time</span>
                    <span>{new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
                
                <button
                  className="btn btn-primary w-full"
                  onClick={resetValidation}
                >
                  Validate Another Ticket
                </button>
              </div>
            ) : (
              <div className="text-center">
                <button
                  className="btn btn-primary"
                  onClick={resetValidation}
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
