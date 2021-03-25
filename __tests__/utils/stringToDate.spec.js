import { stringToDate } from "../../utils"

describe("stringToDate", () => {
  it("returns 'Jan 5, 2021' when receives '2021-01-05T15:45:03.077Z'", () => {
    expect(stringToDate("2021-01-05T15:45:03.077Z")).toEqual("Jan 5, 2021")
  })

  it("returns 'Feb 5, 2021' when receives '2021-02-05T15:45:03.077Z'", () => {
    expect(stringToDate("2021-02-05T15:45:03.077Z")).toEqual("Feb 5, 2021")
  })
})
