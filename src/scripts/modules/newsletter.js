/**
 * Newsletter sign-up.
 * TODO: wire to an email provider (Mailchimp, ConvertKit, Buttondown…).
 */
export function initNewsletter() {
  const form = document.querySelector('[data-newsletter]');
  if (!form) return;

  const input = form.querySelector('input[type="email"]');
  const status = form.querySelector('[data-newsletter-status]');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!input.checkValidity()) {
      input.reportValidity();
      return;
    }
    status.textContent = "Thanks — you're on the list.";
    form.reset();
  });
}
