import { Layout, AppLink } from "../components"

const HomePage = () => {
  return (
    <Layout>
      <h1 className="text-6xl font-bold text-center">
        Welcome to{" "}
        <AppLink href="/articles">
          <a className="text-blue-500">Articles</a>
        </AppLink>
      </h1>
    </Layout>
  )
}

export default HomePage
