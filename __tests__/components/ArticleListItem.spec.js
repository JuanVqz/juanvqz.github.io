import { render } from "@testing-library/react"
import { article } from "../../data/testing"

import { ArticleListItem } from "../../components"

describe("ArticleListItem", () => {
  it("renders the component", () => {
    const { getByText } = render(<ArticleListItem {...article} />)

    const published_at = getByText(/Jan 5, 2021/)
    const title = getByText(/My daily report - 20210104/)
    const description = getByText(/Yesterday I was writing/)
    const button = getByText(/Read more/)

    expect(published_at).toBeInTheDocument()
    expect(title).toBeInTheDocument()
    expect(description).toBeInTheDocument()
    expect(button).toBeInTheDocument()
    expect(button.getAttribute("href")).toEqual(`/articles/${article.slug}`)
  })
})
