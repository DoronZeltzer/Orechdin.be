
async function test() {
  const prompt = "Please write a JSON formatted response with `{` as the very first character.";
  const res = await fetch("https://text.pollinations.ai/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai",
        search: false,
        messages: [{ role: "user", content: prompt }]
      })
  });
  console.log(res.status);
  console.log(await res.text());
}
test();

