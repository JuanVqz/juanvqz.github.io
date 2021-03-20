import { Layout, Article } from "../components"

const Articles = ({ articles }) => {
  return (
    <Layout title="My articles">
      <ul>
        {articles.map((article) => (
          <Article {...article} key={article.id} />
        ))}
      </ul>
    </Layout>
  )
}

export async function getServerSideProps() {
  const res = await fetch("https://dev.to/api/articles/me", {
    method: "GET",
    headers: { "api-key": process.env.DEV_TO_API_KEY },
  })
  const articles = await res.json()

  if (!articles) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      articles,
    },
  }
}

export default Articles
