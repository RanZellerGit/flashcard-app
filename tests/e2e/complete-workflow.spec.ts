import { test, expect } from '@playwright/test'

test.describe('Complete User Workflow', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear storage before each test
    await context.clearCookies()
    await page.goto('http://localhost:3000')
  })

  test('should complete full flashcard learning workflow', async ({ page }) => {
    // 1. Create a new deck
    await page.click('button:has-text("Create Your First Deck")')
    await page.fill('input[placeholder*="deck"]', 'Biology 101')
    await page.click('button:has-text("Create Deck")')

    // Wait for navigation to deck detail page
    await page.waitForURL(/\/deck\//)
    expect(page.url()).toContain('/deck/')

    // 2. Verify deck was created
    await expect(page.locator('text=Biology 101')).toBeVisible()

    // 3. Add first card
    await page.click('button:has-text("Add Card")')
    await page.fill('input[placeholder*="question"]', 'What is photosynthesis?')
    await page.fill('input[placeholder*="answer"]', 'Process by which plants convert light to chemical energy')
    await page.click('button:has-text("Add Card")')

    // 4. Verify card was added
    await expect(page.locator('text=What is photosynthesis?')).toBeVisible()

    // 5. Add second card
    await page.click('button:has-text("Add Card")')
    await page.fill('input[placeholder*="question"]', 'What is cellular respiration?')
    await page.fill('input[placeholder*="answer"]', 'Process by which cells break down glucose for energy')
    await page.click('button:has-text("Add Card")')

    // 6. Start studying
    await page.click('button:has-text("Start Study")')
    await page.waitForURL(/\/deck\/.*\/study/)

    // 7. Verify card is displayed
    await expect(page.locator('text=What is photosynthesis?')).toBeVisible()
    await expect(page.locator('text=Card 1 of 2')).toBeVisible()

    // 8. Flip the card
    await page.locator('button[aria-label*="Flashcard"]').click()
    await expect(page.locator('text=Process by which plants')).toBeVisible()

    // 9. Navigate to next card
    await page.click('button:has-text("Next")')
    await expect(page.locator('text=What is cellular respiration?')).toBeVisible()
    await expect(page.locator('text=Card 2 of 2')).toBeVisible()

    // 10. Finish studying
    await page.click('button:has-text("Finish")')
    await expect(page.locator('text=Study Complete!')).toBeVisible()

    // 11. Review again
    await page.click('button:has-text("Review Again")')
    await expect(page.locator('text=What is photosynthesis?')).toBeVisible()

    // 12. Exit to deck
    await page.click('button[aria-label="Exit study mode"]')
    await expect(page.locator('text=Exit Study Mode?')).toBeVisible()
    await page.click('button:has-text("Exit")')

    // 13. Verify back on deck page
    await expect(page.locator('text=Biology 101')).toBeVisible()
  })

  test('should handle deck management operations', async ({ page }) => {
    // Create multiple decks
    await page.click('button:has-text("Create Your First Deck")')
    await page.fill('input[placeholder*="deck"]', 'Spanish Vocab')
    await page.click('button:has-text("Create Deck")')
    await page.waitForURL(/\/deck\//)

    // Go back to dashboard
    await page.click('text=← Back to Dashboard')

    // Create another deck
    await page.click('button:has-text("Create")')
    await page.fill('input[placeholder*="deck"]', 'Math Formulas')
    await page.click('button:has-text("Create Deck")')
    await page.waitForURL(/\/deck\//)

    // Go back to dashboard
    await page.click('text=← Back to Dashboard')

    // Verify both decks are listed
    await expect(page.locator('text=Spanish Vocab')).toBeVisible()
    await expect(page.locator('text=Math Formulas')).toBeVisible()
  })

  test('should resume interrupted study session', async ({ page }) => {
    // Create deck
    await page.click('button:has-text("Create Your First Deck")')
    await page.fill('input[placeholder*="deck"]', 'Resume Test')
    await page.click('button:has-text("Create Deck")')
    await page.waitForURL(/\/deck\//)

    // Add cards
    for (let i = 1; i <= 3; i++) {
      await page.click('button:has-text("Add Card")')
      await page.fill('input[placeholder*="question"]', `Question ${i}`)
      await page.fill('input[placeholder*="answer"]', `Answer ${i}`)
      await page.click('button:has-text("Add Card")')
    }

    // Start studying
    await page.click('button:has-text("Start Study")')
    await page.waitForURL(/\/deck\/.*\/study/)

    // Navigate to second card
    await page.click('button:has-text("Next")')
    await expect(page.locator('text=Question 2')).toBeVisible()

    // Exit study
    await page.click('button[aria-label="Exit study mode"]')
    await page.click('button:has-text("Exit")')

    // Resume study
    await page.click('button:has-text("Resume Study")')
    await page.waitForURL(/\/deck\/.*\/study/)

    // Verify we're on card 2
    await expect(page.locator('text=Question 2')).toBeVisible()
    await expect(page.locator('text=Card 2 of 3')).toBeVisible()
  })

  test('should navigate with keyboard shortcuts', async ({ page }) => {
    // Create deck and add cards
    await page.click('button:has-text("Create Your First Deck")')
    await page.fill('input[placeholder*="deck"]', 'Keyboard Test')
    await page.click('button:has-text("Create Deck")')
    await page.waitForURL(/\/deck\//)

    // Add two cards
    for (let i = 1; i <= 2; i++) {
      await page.click('button:has-text("Add Card")')
      await page.fill('input[placeholder*="question"]', `Q${i}`)
      await page.fill('input[placeholder*="answer"]', `A${i}`)
      await page.click('button:has-text("Add Card")')
    }

    // Start studying
    await page.click('button:has-text("Start Study")')
    await page.waitForURL(/\/deck\/.*\/study/)

    // Test Space to flip
    await page.keyboard.press('Space')
    await expect(page.locator('text=A1')).toBeVisible()

    // Test Space to flip back
    await page.keyboard.press('Space')
    await expect(page.locator('text=Q1')).toBeVisible()

    // Test Arrow Right to navigate next
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('text=Q2')).toBeVisible()

    // Test Arrow Left to navigate previous
    await page.keyboard.press('ArrowLeft')
    await expect(page.locator('text=Q1')).toBeVisible()
  })

  test('should handle responsive design on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Create deck
    await page.click('button:has-text("Create Your First Deck")')
    await page.fill('input[placeholder*="deck"]', 'Mobile Test')
    await page.click('button:has-text("Create Deck")')
    await page.waitForURL(/\/deck\//)

    // Add card
    await page.click('button:has-text("Add Card")')
    await page.fill('input[placeholder*="question"]', 'Mobile Question')
    await page.fill('input[placeholder*="answer"]', 'Mobile Answer')
    await page.click('button:has-text("Add Card")')

    // Start studying
    await page.click('button:has-text("Start Study")')
    await page.waitForURL(/\/deck\/.*\/study/)

    // Verify card is visible on mobile
    await expect(page.locator('text=Mobile Question')).toBeVisible()

    // Test flip on mobile
    await page.locator('button[aria-label*="Flashcard"]').click()
    await expect(page.locator('text=Mobile Answer')).toBeVisible()

    // Test navigation buttons fit on screen
    const buttons = page.locator('button:has-text("Previous"), button:has-text("Next")')
    const count = await buttons.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should display error handling gracefully', async ({ page }) => {
    // Navigate to non-existent deck
    await page.goto('http://localhost:3000/deck/nonexistent')

    // Should redirect or show error
    const url = page.url()
    expect(url).not.toContain('nonexistent')
  })
})
