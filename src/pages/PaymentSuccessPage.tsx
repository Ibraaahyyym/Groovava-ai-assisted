import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ArrowLeft, CreditCard } from 'lucide-react';

const PaymentSuccessPage: React.FC = () => {
  const location = useLocation();
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'success' | 'failed' | 'cancelled'>('loading');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  useEffect(() => {
    // Parse URL parameters
    const urlParams = new URLSearchParams(location.search);
    const reference = urlParams.get('reference');
    const trxref = urlParams.get('trxref');
    const status = urlParams.get('status');

    console.log('Payment callback received with parameters:', {
      reference,
      trxref,
      status,
      fullUrl: window.location.href,
      search: location.search
    });

    // Store payment details
    const details = {
      reference: reference || trxref,
      status,
      timestamp: new Date().toISOString()
    };
    setPaymentDetails(details);

    // Determine payment status based on Paystack response
    if (status === 'success') {
      setPaymentStatus('success');
    } else if (status === 'cancelled') {
      setPaymentStatus('cancelled');
    } else {
      setPaymentStatus('failed');
    }

    // Log for debugging
    console.log('Payment status determined:', {
      paymentStatus: status === 'success' ? 'success' : status === 'cancelled' ? 'cancelled' : 'failed',
      details
    });
  }, [location]);

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />;
      case 'failed':
        return <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />;
      case 'cancelled':
        return <XCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />;
      default:
        return <Loader2 className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-spin" />;
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'success':
        return {
          title: 'Payment Successful!',
          message: 'Your ticket purchase has been completed successfully. You should receive a confirmation email shortly.',
          color: 'text-green-400'
        };
      case 'failed':
        return {
          title: 'Payment Failed',
          message: 'Unfortunately, your payment could not be processed. Please try again or contact support if the issue persists.',
          color: 'text-red-400'
        };
      case 'cancelled':
        return {
          title: 'Payment Cancelled',
          message: 'You cancelled the payment process. No charges have been made to your account.',
          color: 'text-yellow-400'
        };
      default:
        return {
          title: 'Processing Payment...',
          message: 'Please wait while we verify your payment status.',
          color: 'text-purple-400'
        };
    }
  };

  const statusInfo = getStatusMessage();

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="max-w-md w-full">
        {/* Back to Events Link */}
        <Link 
          to="/" 
          className="inline-flex items-center text-purple-400 hover:text-purple-300 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Events
        </Link>

        {/* Payment Status Card */}
        <div className="bg-gray-100 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700/50 p-8 text-center transition-colors duration-300">
          {getStatusIcon()}
          
          <h1 className={`text-2xl font-bold mb-4 ${statusInfo.color}`}>
            {statusInfo.title}
          </h1>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed transition-colors duration-300">
            {statusInfo.message}
          </p>

          {/* Payment Details */}
          {paymentDetails && (
            <div className="bg-gray-200 dark:bg-gray-900/50 rounded-lg p-4 mb-6 text-left transition-colors duration-300">
              <h3 className="text-gray-900 dark:text-white font-semibold mb-3 flex items-center transition-colors duration-300">
                <CreditCard className="w-4 h-4 mr-2" />
                Transaction Details
              </h3>
              <div className="space-y-2 text-sm">
                {paymentDetails.reference && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400 transition-colors duration-300">Reference:</span>
                    <span className="text-gray-900 dark:text-white font-mono transition-colors duration-300">{paymentDetails.reference}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400 transition-colors duration-300">Status:</span>
                  <span className={`font-semibold ${statusInfo.color}`}>
                    {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400 transition-colors duration-300">Time:</span>
                  <span className="text-gray-900 dark:text-white transition-colors duration-300">
                    {new Date(paymentDetails.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {paymentStatus === 'success' && (
              <Link
                to="/profile"
                className="block w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-green-500/25"
              >
                View My Tickets
              </Link>
            )}
            
            {(paymentStatus === 'failed' || paymentStatus === 'cancelled') && (
              <button
                onClick={() => window.history.back()}
                className="block w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25"
              >
                Try Again
              </button>
            )}
            
            <Link
              to="/"
              className="block w-full px-6 py-3 border border-gray-400 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:border-gray-500 dark:hover:border-gray-500 font-semibold rounded-lg transition-all duration-200 text-center"
            >
              Browse More Events
            </Link>
          </div>
        </div>

        {/* Debug Information (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 bg-gray-200 dark:bg-gray-900/50 rounded-lg p-4 text-xs transition-colors duration-300">
            <h4 className="text-gray-600 dark:text-gray-400 font-semibold mb-2 transition-colors duration-300">Debug Info:</h4>
            <pre className="text-gray-700 dark:text-gray-500 overflow-x-auto transition-colors duration-300">
              {JSON.stringify({
                search: location.search,
                paymentDetails,
                paymentStatus
              }, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccessPage;