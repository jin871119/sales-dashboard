/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel 배포 최적화 (standalone 제거 - Vercel이 자체 빌드 시스템 사용)
  
  // 큰 파일 처리 최적화
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  
  // 이미지 최적화
  images: {
    unoptimized: true,
  },
  
  // 웹팩 설정
  webpack: (config, { isServer }) => {
    // 서버 사이드에서 xlsx 라이브러리 최적화
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'canvas': 'commonjs canvas',
      });
    }
    
    return config;
  },
}

module.exports = nextConfig


