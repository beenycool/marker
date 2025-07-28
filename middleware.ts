export default async function middleware() {
  // Simple passthrough - no personal data collection
  return new Response(null, { status: 200 });
}

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
