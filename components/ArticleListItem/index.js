import { AppImage } from "../../components"

const ArticleListItem = ({ article }) => {
  return (
    <>
      <h1>{article.title}</h1>
      {article.cover_image && (
        <AppImage
          src={article.cover_image}
          alt={article.title}
          height={400}
          width={800}
        />
      )}
    </>
  )
}

export default ArticleListItem
