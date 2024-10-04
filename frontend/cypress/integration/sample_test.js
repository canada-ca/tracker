describe('My First Test', () => {
    it('Visits the Kitchen Sink', () => {
      cy.visit('https://example.cypress.io') // Change this to your application's URL
      cy.contains('type').click()
    })
  })
  