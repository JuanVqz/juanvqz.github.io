export default async function articlesAPI(_req, res) {
  const response = await fetch("https://dev.to/api/articles/me", {
    method: "GET",
    headers: { "api-key": process.env.DEV_TO_API_KEY },
  })
  const articles = await response.json()
  res.status(200).json(articles)
}
