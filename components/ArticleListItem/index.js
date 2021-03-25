import { AppLink } from "../../components"
import { stringToDate } from "../../utils"

const ArticleListItem = ({ published_at, title, description, slug }) => {
  return (
    <article className="py-12 border-t-2 border-gray-200 space-y-4">
      <div className="text-gray-500 text-opacity-95">
        {stringToDate(published_at)}
      </div>
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="text-base text-black">{description}</div>
      <AppLink href={`/articles/${slug}`}>
        <a className="text-green-700 font-base">Read more →</a>
      </AppLink>
    </article>
  )
}

export default ArticleListItem
