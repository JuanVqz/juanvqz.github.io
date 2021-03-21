import { render } from "@testing-library/react"

import HomePage from "../../pages/"

describe("HomePage", function () {
  it("returns a welcome message", function () {
    const { getByText } = render(<HomePage />)
    const welcome = getByText(/Welcome/)
    expect(welcome).toBeInTheDocument()
  })
})
