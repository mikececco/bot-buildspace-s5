import { config } from '#root/config.js'

export interface Price {
  label: string
  amount: number // Amount should be in the smallest units of the currency (e.g., cents)
}

export interface SendInvoiceParams {
  chatId: number
  title: string
  description: string
  payload: string
  providerToken: string
  startParameter: string
  currency: string
  prices: Price[]
}

export async function sendInvoice({
  chatId,
  title,
  description,
  payload,
  providerToken,
  startParameter,
  currency,
  prices,
}: SendInvoiceParams): Promise<any> {
  const apiUrl = `https://api.telegram.org/bot${config.BOT_TOKEN}/sendInvoice`

  const invoice = {
    chat_id: chatId,
    title,
    description,
    payload,
    provider_token: providerToken,
    start_parameter: startParameter,
    currency,
    prices,
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoice),
    })

    const data = await response.json()
    // console.log(data)
    return data
  }
  catch (error: any) {
    console.error('There was a problem sending the invoice:', error)
    return error.message
  }
}
