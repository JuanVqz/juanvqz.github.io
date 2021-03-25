const DATE_OPTIONS = {
  year: "numeric",
  month: "short",
  day: "numeric",
}

const stringToDate = (string) =>
  new Date(string).toLocaleDateString("en-US", DATE_OPTIONS)

export { stringToDate }
