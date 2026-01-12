export const parseExpense = (input: string) => {
  const match = input.match(/\$(\d+(?:\.\d{2})?)/)
  if (!match) return

  const value = parseFloat(match[1])
  const label = input
    .replace(/\$(\d+(?:\.\d{2})?)/, '')
    .replace('#expense', '')
    .trim()
  return {
    label: label,
    value: value,
  }
}
