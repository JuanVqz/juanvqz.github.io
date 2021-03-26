import { AppLink } from "../../components"
import { stringToDate } from "../../utils"

const ArticleListItem = ({ published_at, title, description, slug }) => {
  return (
    <article className="py-12 border-t-2 border-green-700 border-opacity-30 space-y-4">
      <div className="text-gray-500 text-opacity-95">
        {stringToDate(published_at)}
      </div>
      <AppLink href={`/articles/${slug}`}>
        <h1 className="text-2xl font-bold">{title}</h1>
      </AppLink>
      <div className="text-justify">{description}</div>
      <AppLink href={`/articles/${slug}`}>
        <a className="text-green-700">Read more →</a>
      </AppLink>
    </article>
  )
}

export default ArticleListItem
