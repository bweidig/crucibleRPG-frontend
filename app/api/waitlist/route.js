export async function POST(request) {
  const { email } = await request.json();

  if (!email || !email.includes("@")) {
    return Response.json({ error: "Valid email required." }, { status: 400 });
  }

  const apiKey = process.env.BUTTONDOWN_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Waitlist is temporarily unavailable." },
      { status: 503 }
    );
  }

  const res = await fetch("https://api.buttondown.com/v1/subscribers", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email_address: email }),
  });

  if (res.ok || res.status === 201) {
    return Response.json({ success: true });
  }

  if (res.status === 409) {
    // Already subscribed — treat as success
    return Response.json({ success: true });
  }

  return Response.json(
    { error: "Something went wrong. Please try again." },
    { status: 500 }
  );
}
