// Convert amount to Indian Rupees words
export function amountToWords(amount: number): string {
  if (amount === 0) return 'Zero Rupees Only'
  
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'
  ]
  
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ]
  
  const teens = [
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
    'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ]

  function convertLessThanThousand(num: number): string {
    if (num === 0) return ''
    
    if (num < 10) return ones[num]
    
    if (num < 20) return teens[num - 10]
    
    if (num < 100) {
      const ten = Math.floor(num / 10)
      const one = num % 10
      return tens[ten] + (one > 0 ? ' ' + ones[one] : '')
    }
    
    const hundred = Math.floor(num / 100)
    const remainder = num % 100
    return ones[hundred] + ' Hundred' + (remainder > 0 ? ' ' + convertLessThanThousand(remainder) : '')
  }

  // Split into rupees and paise
  const rupees = Math.floor(amount)
  const paise = Math.round((amount - rupees) * 100)
  
  if (rupees === 0 && paise > 0) {
    return convertLessThanThousand(paise) + ' Paise Only'
  }

  // Indian numbering system: crores, lakhs, thousands, hundreds
  const crores = Math.floor(rupees / 10000000)
  const lakhs = Math.floor((rupees % 10000000) / 100000)
  const thousands = Math.floor((rupees % 100000) / 1000)
  const remainder = rupees % 1000

  let words = 'Rupees '
  
  if (crores > 0) {
    words += convertLessThanThousand(crores) + ' Crore '
  }
  
  if (lakhs > 0) {
    words += convertLessThanThousand(lakhs) + ' Lakh '
  }
  
  if (thousands > 0) {
    words += convertLessThanThousand(thousands) + ' Thousand '
  }
  
  if (remainder > 0) {
    words += convertLessThanThousand(remainder) + ' '
  }

  if (paise > 0) {
    words += 'and ' + convertLessThanThousand(paise) + ' Paise '
  }

  return words.trim() + ' Only'
}
