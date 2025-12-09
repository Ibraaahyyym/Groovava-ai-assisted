import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface PaymentRequest {
  amount: number // Amount in kobo
  email: string
  reference: string
  callback_url: string
  metadata: {
    event_id: number
    ticket_type: string
    user_id: string
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get the request body
    const requestBody: PaymentRequest = await req.json()
    
    // Validate required fields
    if (!requestBody.amount || !requestBody.email || !requestBody.reference) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: amount, email, reference' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get Paystack secret key from environment variables
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY')
    
    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY not found in environment variables')
      return new Response(
        JSON.stringify({ error: 'Payment service configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Prepare Paystack API request
    const paystackData = {
      amount: requestBody.amount,
      email: requestBody.email,
      reference: requestBody.reference,
      callback_url: requestBody.callback_url,
      metadata: requestBody.metadata,
      currency: 'NGN'
    }

    console.log('Initiating Paystack payment with data:', {
      ...paystackData,
      amount: `₦${paystackData.amount / 100}` // Log in Naira for readability
    })

    // Make request to Paystack API
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paystackData)
    })

    const paystackResult = await paystackResponse.json()

    if (!paystackResponse.ok) {
      console.error('Paystack API error:', paystackResult)
      return new Response(
        JSON.stringify({ 
          error: 'Payment initialization failed', 
          details: paystackResult.message || 'Unknown error' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Paystack payment initialized successfully:', {
      reference: requestBody.reference,
      authorization_url: paystackResult.data.authorization_url
    })

    // Return the authorization URL to the frontend
    return new Response(
      JSON.stringify({
        success: true,
        authorization_url: paystackResult.data.authorization_url,
        reference: paystackResult.data.reference
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})