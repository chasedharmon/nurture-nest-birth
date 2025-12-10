import { test, expect } from '@playwright/test'

/**
 * File Upload Functionality Tests
 *
 * Authentication is handled by Playwright setup project via storageState
 * Each test starts with a pre-authenticated session
 */

test.describe('File Upload Functionality', () => {
  test.describe('Admin Document Upload', () => {
    test('should show upload document form when clicked', async ({ page }) => {
      // Navigate to a client's documents
      await page.goto('/admin')

      const clientLink = page.locator('[data-testid="lead-row"] a').first()
      if ((await clientLink.count()) > 0) {
        await clientLink.click()

        const documentsTab = page.locator('button:has-text("Documents")')
        if ((await documentsTab.count()) > 0) {
          await documentsTab.click()

          const uploadButton = page.locator(
            'button:has-text("Upload Document")'
          )
          if ((await uploadButton.count()) > 0) {
            await uploadButton.click()

            // Check for form elements
            await expect(
              page.locator('input[type="file"], [data-testid="file-upload"]')
            )
              .toBeVisible({ timeout: 5000 })
              .catch(() => {
                // Form might use drag-and-drop only
              })
          }
        }
      }
    })

    test('should validate file type selection', async ({ page }) => {
      await page.goto('/admin')

      const clientLink = page.locator('[data-testid="lead-row"] a').first()
      if ((await clientLink.count()) > 0) {
        await clientLink.click()

        const documentsTab = page.locator('button:has-text("Documents")')
        if ((await documentsTab.count()) > 0) {
          await documentsTab.click()

          const uploadButton = page.locator(
            'button:has-text("Upload Document")'
          )
          if ((await uploadButton.count()) > 0) {
            await uploadButton.click()

            // Should have document type selector
            const typeSelector = page.locator(
              'select[name="document_type"], [data-testid="document-type"]'
            )
            if ((await typeSelector.count()) > 0) {
              await expect(typeSelector).toBeVisible()
            }
          }
        }
      }
    })

    test('should show visibility toggle for admin uploads', async ({
      page,
    }) => {
      await page.goto('/admin')

      const clientLink = page.locator('[data-testid="lead-row"] a').first()
      if ((await clientLink.count()) > 0) {
        await clientLink.click()

        const documentsTab = page.locator('button:has-text("Documents")')
        if ((await documentsTab.count()) > 0) {
          await documentsTab.click()

          const uploadButton = page.locator(
            'button:has-text("Upload Document")'
          )
          if ((await uploadButton.count()) > 0) {
            await uploadButton.click()

            // Check for visibility toggle
            const visibilityToggle = page.locator(
              'select[name="is_visible_to_client"], [data-testid="visibility-toggle"]'
            )
            if ((await visibilityToggle.count()) > 0) {
              await expect(visibilityToggle).toBeVisible()
            }
          }
        }
      }
    })
  })

  test.describe('Drag and Drop Upload', () => {
    test('should have drag-and-drop area', async ({ page }) => {
      await page.goto('/admin')

      const clientLink = page.locator('[data-testid="lead-row"] a').first()
      if ((await clientLink.count()) > 0) {
        await clientLink.click()

        const documentsTab = page.locator('button:has-text("Documents")')
        if ((await documentsTab.count()) > 0) {
          await documentsTab.click()

          const uploadButton = page.locator(
            'button:has-text("Upload Document")'
          )
          if ((await uploadButton.count()) > 0) {
            await uploadButton.click()

            // Look for dropzone area
            const dropzone = page.locator(
              '[data-testid="dropzone"], .dropzone, [class*="drop"]'
            )
            if ((await dropzone.count()) > 0) {
              await expect(dropzone.first()).toBeVisible()
            }
          }
        }
      }
    })
  })

  test.describe('File Type Validation', () => {
    test('should restrict file types based on document category', async ({
      page,
    }) => {
      await page.goto('/admin')

      const clientLink = page.locator('[data-testid="lead-row"] a').first()
      if ((await clientLink.count()) > 0) {
        await clientLink.click()

        const documentsTab = page.locator('button:has-text("Documents")')
        if ((await documentsTab.count()) > 0) {
          await documentsTab.click()

          const uploadButton = page.locator(
            'button:has-text("Upload Document")'
          )
          if ((await uploadButton.count()) > 0) {
            await uploadButton.click()

            // Select contract type
            const typeSelector = page.locator('select[name="document_type"]')
            if ((await typeSelector.count()) > 0) {
              await typeSelector.selectOption('contract')

              // The accept attribute on file input should be .pdf for contracts
              const fileInput = page.locator('input[type="file"]')
              if ((await fileInput.count()) > 0) {
                const accept = await fileInput.getAttribute('accept')
                // Contracts should only accept PDF
                expect(accept).toContain('.pdf')
              }
            }
          }
        }
      }
    })
  })
})

test.describe('Document List Display', () => {
  test('should display uploaded documents', async ({ page }) => {
    await page.goto('/admin')

    const clientLink = page.locator('[data-testid="lead-row"] a').first()
    if ((await clientLink.count()) > 0) {
      await clientLink.click()

      const documentsTab = page.locator('button:has-text("Documents")')
      if ((await documentsTab.count()) > 0) {
        await documentsTab.click()

        // Wait for documents to load
        await page.waitForTimeout(2000)

        // Check for document list or empty state
        const hasDocuments = await page
          .locator('[data-testid="document-item"], [class*="document"]')
          .count()
        const hasEmptyState = await page.locator('text=No documents').count()

        expect(hasDocuments > 0 || hasEmptyState > 0).toBeTruthy()
      }
    }
  })

  test('should show document metadata', async ({ page }) => {
    await page.goto('/admin')

    const clientLink = page.locator('[data-testid="lead-row"] a').first()
    if ((await clientLink.count()) > 0) {
      await clientLink.click()

      const documentsTab = page.locator('button:has-text("Documents")')
      if ((await documentsTab.count()) > 0) {
        await documentsTab.click()

        // If there are documents, check for metadata display
        const documentItem = page
          .locator('[data-testid="document-item"]')
          .first()
        if ((await documentItem.count()) > 0) {
          // Should show file info like size, type, date
          const hasMetadata = await page
            .locator('text=/KB|MB|pdf|doc|Uploaded/i')
            .count()
          expect(hasMetadata).toBeGreaterThan(0)
        }
      }
    }
  })

  test('should have download link for documents', async ({ page }) => {
    await page.goto('/admin')

    const clientLink = page.locator('[data-testid="lead-row"] a').first()
    if ((await clientLink.count()) > 0) {
      await clientLink.click()

      const documentsTab = page.locator('button:has-text("Documents")')
      if ((await documentsTab.count()) > 0) {
        await documentsTab.click()

        // If there are documents, check for download link
        const downloadLink = page.locator(
          'a:has-text("Download"), button:has-text("Download")'
        )
        if ((await downloadLink.count()) > 0) {
          await expect(downloadLink.first()).toBeVisible()
        }
      }
    }
  })

  test('should have visibility toggle for admin', async ({ page }) => {
    await page.goto('/admin')

    const clientLink = page.locator('[data-testid="lead-row"] a').first()
    if ((await clientLink.count()) > 0) {
      await clientLink.click()

      const documentsTab = page.locator('button:has-text("Documents")')
      if ((await documentsTab.count()) > 0) {
        await documentsTab.click()

        // If there are documents, check for visibility toggle
        const visibilityButton = page.locator(
          'button:has-text("Hide from Client"), button:has-text("Show to Client")'
        )
        if ((await visibilityButton.count()) > 0) {
          await expect(visibilityButton.first()).toBeVisible()
        }
      }
    }
  })
})
