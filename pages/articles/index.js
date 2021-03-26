import { Layout, ArticleListItem } from "../../components"

const ArticlesPage = ({ articles }) => {
  return (
    <Layout title="My Articles">
      <div className="container mx-auto flex flex-col">
        {articles.map((article) => (
          <ArticleListItem {...article} key={article.id} />
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
      redirect: {
        destination: "/",
        permanent: false,
      },
    }
  }

  return {
    props: {
      articles,
    },
  }
}

export default ArticlesPage
