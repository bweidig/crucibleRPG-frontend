export async function POST(request) {
  const { password } = await request.json();

  const correctPassword = process.env.COMING_SOON_PASSWORD;
  if (!correctPassword) {
    return Response.json({ success: false }, { status: 503 });
  }

  const success = password === correctPassword;
  return Response.json({ success });
}
