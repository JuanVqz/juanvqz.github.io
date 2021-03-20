const Article = ({ title, cover_image }) => {
  return (
    <>
      <h1>{title}</h1>
      {cover_image && <img src={cover_image} alt={title} />}
    </>
  )
}

export default Article
