export const parseExpense = (input: string) => {
  const match = input.match(/\$(\d+(?:\.\d{2})?)/)
  if (!match) return

  const value = parseFloat(match[1])
  const label = input.replace(/\$(\d+(?:\.\d{2})?)/, '').trim()
  return {
    label: label,
    value: value,
  }
}
