export async function POST(request) {
  const { password } = await request.json();

  const correctPassword = process.env.COMING_SOON_PASSWORD;
  if (!correctPassword) {
    return Response.json({ success: false }, { status: 503 });
  }

  const success = password === correctPassword;

  if (success) {
    const response = Response.json({ success });
    response.headers.append(
      "Set-Cookie",
      `crucible_access=1; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`
    );
    return response;
  }

  return Response.json({ success });
}
