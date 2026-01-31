import { expect, test } from "./fixtures";

test("shows the Airline Protocol cockpit", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Airline Protocol")).toBeVisible();
  await expect(page.getByText("Flight deck for on-chain credit.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Start localnet" })).toBeVisible();
});
