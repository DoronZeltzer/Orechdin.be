
async function test() {
  const req = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai",
        prompt: "Hello",
        persona: "intake_concierge"
      })
  };
  const res = await fetch("http://localhost:3001/api/v1/infer", req);
  console.log(res.status);
  console.log(await res.text());
}
test();

