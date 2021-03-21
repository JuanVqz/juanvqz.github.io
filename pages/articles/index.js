import { Layout, ArticleListItem } from "../../components"

const ArticlesPage = ({ articles }) => {
  return (
    <Layout title="My Articles">
      <ul>
        {articles.map((article) => (
          <ArticleListItem article={article} key={article.id} />
        ))}
      </ul>
    </Layout>
  )
}

export async function getServerSideProps() {
  const res = await fetch(`${process.env.API_HOST}/articles/me`, {
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

export default ArticlesPage
