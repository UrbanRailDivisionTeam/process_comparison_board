import type { NextConfig } from "next"

const nextConfig: NextConfig = {
    output: "export",
    // 纯静态部署，禁用图片优化（static export 不支持）
    images: {
        unoptimized: true,
    },
}

export default nextConfig
