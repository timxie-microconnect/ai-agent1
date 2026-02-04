import { jsxRenderer } from 'hono/jsx-renderer'

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>滴灌通·投流通 - 抖音电商投流融资平台</title>
        <meta name="description" content="滴灌通投流通，以金融科技赋能电商投流增长，连接全球资本与小微企业。非股非债，按日分成，助力抖音电商增长。" />
        
        {/* Tailwind CSS */}
        <script src="https://cdn.tailwindcss.com"></script>
        
        {/* Font Awesome */}
        <link 
          href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" 
          rel="stylesheet"
        />
        
        {/* Custom CSS */}
        <link href="/static/style.css" rel="stylesheet" />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
})
