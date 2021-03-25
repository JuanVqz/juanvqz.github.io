import { Layout, ArticleListItem } from "../../components"

const ArticlesPage = ({ articles }) => {
  return (
    <Layout title="My Articles">
      <div className="container p-4 grid">
        {articles.map((article) => (
          <ArticleListItem article={article} key={article.id} />
        ))}
      </div>
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
