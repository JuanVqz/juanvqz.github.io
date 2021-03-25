import { render } from "@testing-library/react"

import { ArticleListItem } from "../../components"

describe("ArticleListItem", () => {
  let article = {
    type_of: "article",
    id: 562143,
    title: "My daily report - 20210104",
    description:
      "Yesterday I was writing a callback test in RoR with RSpec.  When I noticed that I forgot the standard...",
    published: true,
    published_at: "2021-01-05T15:45:03.077Z",
    slug: "my-daily-report-20210104-3i5b",
    path: "/juanvqz/my-daily-report-20210104-3i5b",
    url: "https://dev.to/juanvqz/my-daily-report-20210104-3i5b",
    comments_count: 0,
    public_reactions_count: 0,
    page_views_count: 0,
    published_timestamp: "2021-01-05T15:45:03Z",
    body_markdown:
      'Yesterday I was writing a callback test in [RoR](https://rubyonrails.org/) with [RSpec](https://rspec.info/).\n\nWhen I noticed that I forgot the standard how should I write the `description` for `after_create` and this is the answer.\n\n```ruby\ndescribe "#after_create"\nend\n```\n\nThe convention for `class methods` says, they should be writing prefixed with `.`.\n\nThe convention for `instance methods` says, they should be writing prefixed with `#`.\n\nExample.\n\n\n```ruby\n# class methods\n\nUser.actives\n\ndescription ".actives"\nend\n```\n\n```ruby\n# instance methods\n\ncurrent_user.send_welcome_notification\n\ndescription "#send_welcome_notification"\nend\n```\n\nI hope this will be helpful, see you tomorrow!',
    positive_reactions_count: 0,
    cover_image:
      "https://res.cloudinary.com/practicaldev/image/fetch/s--8NPNEfai--/c_imagga_scale,f_auto,fl_progressive,h_420,q_auto,w_1000/https://dev-to-uploads.s3.amazonaws.com/i/6x1ilqe5cdgsdbtbtses.jpeg",
    tag_list: ["rspec", "ruby"],
    canonical_url: "https://dev.to/juanvqz/my-daily-report-20210104-3i5b",
    user: {
      name: "JuanVqz",
      username: "juanvqz",
      twitter_username: null,
      github_username: "JuanVqz",
      website_url: null,
      profile_image:
        "https://res.cloudinary.com/practicaldev/image/fetch/s--tuyH6sXA--/c_fill,f_auto,fl_progressive,h_640,q_auto,w_640/https://dev-to-uploads.s3.amazonaws.com/uploads/user/profile_image/84706/feb55064-a186-4e2b-a28c-f64db8c7127c.jpeg",
      profile_image_90:
        "https://res.cloudinary.com/practicaldev/image/fetch/s--WSCDcwDC--/c_fill,f_auto,fl_progressive,h_90,q_auto,w_90/https://dev-to-uploads.s3.amazonaws.com/uploads/user/profile_image/84706/feb55064-a186-4e2b-a28c-f64db8c7127c.jpeg",
    },
  }

  it.only("renders the component", () => {
    const { getByText } = render(<ArticleListItem article={article} />)

    const published_at = getByText(/Jan 5, 2021/)
    const title = getByText(/My daily report - 20210104/)
    const description = getByText(/Yesterday I was writing/)

    expect(published_at).toBeInTheDocument()
    expect(title).toBeInTheDocument()
    expect(description).toBeInTheDocument()
  })
})
