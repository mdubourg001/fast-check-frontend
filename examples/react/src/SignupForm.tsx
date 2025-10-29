import React, { useState, useRef, useEffect } from "react";

// Composant ErrorBoundary pour capturer les erreurs
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" role="alert">
          <h2>Une erreur est survenue</h2>
          <pre>{this.state.error?.message}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}

// Composant Modal
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus trap
      const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();

      // Échapper pour fermer
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          maxWidth: "500px",
          width: "90%",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "15px",
          }}
        >
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function SignupForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    age: "",
    country: "",
    terms: false,
    newsletter: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);
  const [lastSubmitTime, setLastSubmitTime] = useState<number | null>(null);

  // Validation des champs
  const validateField = (
    name: string,
    value: string | number | boolean
  ): string => {
    switch (name) {
      case "email":
        if (!value) return "Email requis";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value as string))
          return "Email invalide";
        return "";

      case "password":
        if (!value) return "Mot de passe requis";
        if ((value as string).length < 8)
          return "Le mot de passe doit contenir au moins 8 caractères";
        if (!/(?=.*[0-9])/.test(value as string))
          return "Le mot de passe doit contenir au moins un chiffre";
        return "";

      case "confirmPassword":
        if (!value) return "Confirmation requise";
        if (value !== formData.password)
          return "Les mots de passe ne correspondent pas";
        return "";

      case "username":
        if (!value) return "Nom d'utilisateur requis";
        if ((value as string).length < 3) return "Au moins 3 caractères";
        if (!/^[a-zA-Z0-9_]+$/.test(value as string))
          return "Uniquement lettres, chiffres et underscore";
        return "";

      case "age":
        if (
          value &&
          (isNaN(value as number) ||
            (value as number) < 13 ||
            (value as number) > 120)
        ) {
          return "Âge invalide (13-120)";
        }
        return "";

      case "terms":
        if (!value) return "Vous devez accepter les conditions";
        return "";

      default:
        return "";
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    const fieldValue = type === "checkbox" ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: fieldValue,
    }));

    // Validation en temps réel
    const error = validateField(name, fieldValue);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));

    // Cas spécial : revalider confirmPassword quand password change
    if (name === "password" && formData.confirmPassword) {
      const confirmError = validateField(
        "confirmPassword",
        formData.confirmPassword
      );
      setErrors((prev) => ({
        ...prev,
        confirmPassword: confirmError,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Protection contre le double-clic
    const now = Date.now();
    if (lastSubmitTime && now - lastSubmitTime < 500) {
      return;
    }
    setLastSubmitTime(now);

    // Valider tous les champs
    const newErrors: Record<string, string> = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(
        key,
        (formData as Record<string, string | number | boolean>)[key]
      );
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Simulation d'envoi
    setSubmitCount((prev) => prev + 1);
    if (submitCount === 0) {
      setShowModal(true);
    } else {
      setShowConfirmModal(true);
    }
  };

  const handleReset = () => {
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      username: "",
      age: "",
      country: "",
      terms: false,
      newsletter: false,
    });
    setErrors({});
  };

  return (
    <ErrorBoundary>
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
        <h1>Formulaire d'inscription</h1>

        <form onSubmit={handleSubmit} noValidate>
          {/* Champ Email */}
          <div style={{ marginBottom: "15px" }}>
            <label
              htmlFor="email"
              style={{ display: "block", marginBottom: "5px" }}
            >
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              data-testid="input-email"
              value={formData.email}
              onChange={handleChange}
              required
              aria-required="true"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              style={{
                width: "100%",
                padding: "8px",
                border: errors.email ? "1px solid red" : "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
            {errors.email && (
              <span
                id="email-error"
                role="alert"
                style={{ color: "red", fontSize: "14px" }}
              >
                {errors.email}
              </span>
            )}
          </div>

          {/* Champ Nom d'utilisateur */}
          <div style={{ marginBottom: "15px" }}>
            <label
              htmlFor="username"
              style={{ display: "block", marginBottom: "5px" }}
            >
              Nom d'utilisateur *
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              aria-required="true"
              aria-invalid={!!errors.username}
              aria-describedby={errors.username ? "username-error" : undefined}
              style={{
                width: "100%",
                padding: "8px",
                border: errors.username ? "1px solid red" : "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
            {errors.username && (
              <span
                id="username-error"
                role="alert"
                style={{ color: "red", fontSize: "14px" }}
              >
                {errors.username}
              </span>
            )}
          </div>

          {/* Champ Mot de passe */}
          <div style={{ marginBottom: "15px" }}>
            <label
              htmlFor="password"
              style={{ display: "block", marginBottom: "5px" }}
            >
              Mot de passe *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              data-testid="input-password"
              value={formData.password}
              onChange={handleChange}
              required
              aria-required="true"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              style={{
                width: "100%",
                padding: "8px",
                border: errors.password ? "1px solid red" : "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
            {errors.password && (
              <span
                id="password-error"
                role="alert"
                style={{ color: "red", fontSize: "14px" }}
              >
                {errors.password}
              </span>
            )}
          </div>

          {/* Champ Confirmer mot de passe */}
          <div style={{ marginBottom: "15px" }}>
            <label
              htmlFor="confirmPassword"
              style={{ display: "block", marginBottom: "5px" }}
            >
              Confirmer le mot de passe *
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              aria-required="true"
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={
                errors.confirmPassword ? "confirmPassword-error" : undefined
              }
              style={{
                width: "100%",
                padding: "8px",
                border: errors.confirmPassword
                  ? "1px solid red"
                  : "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
            {errors.confirmPassword && (
              <span
                id="confirmPassword-error"
                role="alert"
                style={{ color: "red", fontSize: "14px" }}
              >
                {errors.confirmPassword}
              </span>
            )}
          </div>

          {/* Champ Âge (optionnel) */}
          <div style={{ marginBottom: "15px" }}>
            <label
              htmlFor="age"
              style={{ display: "block", marginBottom: "5px" }}
            >
              Âge (optionnel)
            </label>
            <input
              type="number"
              id="age"
              name="age"
              value={formData.age}
              onChange={handleChange}
              min="13"
              max="120"
              aria-invalid={!!errors.age}
              aria-describedby={errors.age ? "age-error" : undefined}
              style={{
                width: "100%",
                padding: "8px",
                border: errors.age ? "1px solid red" : "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
            {errors.age && (
              <span
                id="age-error"
                role="alert"
                style={{ color: "red", fontSize: "14px" }}
              >
                {errors.age}
              </span>
            )}
          </div>

          {/* Select Pays */}
          <div style={{ marginBottom: "15px" }}>
            <label
              htmlFor="country"
              style={{ display: "block", marginBottom: "5px" }}
            >
              Pays
            </label>
            <select
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            >
              <option value="">-- Sélectionner --</option>
              <option value="fr">France</option>
              <option value="be">Belgique</option>
              <option value="ch">Suisse</option>
              <option value="ca">Canada</option>
            </select>
          </div>

          {/* Checkbox Conditions */}
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "flex", alignItems: "center" }}>
              <input
                type="checkbox"
                name="terms"
                checked={formData.terms}
                onChange={handleChange}
                required
                aria-required="true"
                aria-invalid={!!errors.terms}
                style={{ marginRight: "8px" }}
              />
              J'accepte les conditions d'utilisation *
            </label>
            {errors.terms && (
              <span role="alert" style={{ color: "red", fontSize: "14px" }}>
                {errors.terms}
              </span>
            )}
          </div>

          {/* Checkbox Newsletter */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "flex", alignItems: "center" }}>
              <input
                type="checkbox"
                name="newsletter"
                checked={formData.newsletter}
                onChange={handleChange}
                style={{ marginRight: "8px" }}
              />
              Je souhaite recevoir la newsletter
            </label>
          </div>

          {/* Boutons */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="submit"
              data-testid="submit"
              className="btn btn-primary"
              style={{
                padding: "10px 20px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              S'inscrire
            </button>

            <button
              type="button"
              data-testid="cancel"
              className="btn btn-secondary"
              onClick={handleReset}
              style={{
                padding: "10px 20px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Réinitialiser
            </button>

            <button
              type="button"
              onClick={() => setShowModal(true)}
              style={{
                padding: "10px 20px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Aide
            </button>
          </div>
        </form>

        {/* Modal de succès */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Inscription réussie"
        >
          <p>Votre compte a été créé avec succès !</p>
          <p>Email : {formData.email}</p>
          <button
            onClick={() => setShowModal(false)}
            className="btn"
            style={{
              padding: "8px 16px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Fermer
          </button>
        </Modal>

        {/* Modal de confirmation */}
        <Modal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          title="Confirmation"
        >
          <p>Voulez-vous vraiment soumettre à nouveau le formulaire ?</p>
          <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
            <button
              onClick={() => {
                setShowConfirmModal(false);
                // Réellement soumettre
                console.log("Formulaire soumis:", formData);
              }}
              style={{
                padding: "8px 16px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Confirmer
            </button>
            <button
              onClick={() => setShowConfirmModal(false)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Annuler
            </button>
          </div>
        </Modal>

        {/* Indicateur de soumissions */}
        {submitCount > 0 && (
          <div
            style={{
              marginTop: "20px",
              padding: "10px",
              backgroundColor: "#f0f0f0",
              borderRadius: "4px",
            }}
          >
            Nombre de soumissions : {submitCount}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
