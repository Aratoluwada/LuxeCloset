export async function categorizeClothing(base64Image: string) {
  const response = await fetch("/api/gemini/categorize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64Image }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to categorize clothing");
  }
  return response.json();
}

export async function suggestOutfit(closetItems: any[], events: any[], weather: string) {
  const response = await fetch("/api/gemini/suggest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ closetItems, events, weather }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to suggest outfit");
  }
  return response.json();
}

export async function rateOutfit(items: any[], event: any) {
  const response = await fetch("/api/gemini/rate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items, event }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to rate outfit");
  }
  return response.json();
}
