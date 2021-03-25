import { stringToDate } from "../../utils"

const ArticleListItem = ({ article }) => {
  return (
    <article className="py-12 border-t-2 border-gray-200 space-y-4">
      <div className="text-gray-500 text-opacity-95">
        {stringToDate(article.published_at)}
      </div>
      <h1 className="text-2xl font-bold">{article.title}</h1>
      <div className="text-base text-black">{article.description}</div>
      <button className="text-green-700 font-base">Read more →</button>
    </article>
  )
}

export default ArticleListItem
