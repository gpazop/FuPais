import { useState } from "react";
import CountrySelect, { normalizeCountry } from "./CountrySelect.jsx";

const sections = [
  {
    title: "Información personal",
    fields: [
      { key: "firstName", label: "Nombre", autoComplete: "given-name" },
      { key: "lastName", label: "Apellidos", autoComplete: "family-name" },
      { key: "nationality", label: "Nacionalidad", country: true },
      { key: "residence", label: "País de residencia habitual", country: true }
    ]
  },
  {
    title: "Contacto",
    fields: [
      { key: "email", label: "Correo electrónico", type: "email", autoComplete: "email" },
      { key: "phone", label: "Teléfono con código internacional", type: "tel", autoComplete: "tel" }
    ]
  },
  {
    title: "Contacto de emergencia",
    fields: [
      { key: "emergencyName", label: "Nombre del contacto" },
      { key: "emergencyRelation", label: "Relación" },
      { key: "emergencyPhone", label: "Teléfono de emergencia con código internacional", type: "tel" }
    ]
  }
];

export default function PersonalProfile({ profile, onSave }) {
  const [draft, setDraft] = useState(null);
  const hasDetails = sections.some(({ fields }) => fields.some(({ key }) => profile?.[key]));

  function startEditing() {
    setDraft(Object.fromEntries(sections.flatMap(({ fields }) =>
      fields.map(({ key, country }) => [key, country ? normalizeCountry(profile?.[key]) : profile?.[key] ?? ""])
    )));
  }

  function change(key, value) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }

  function save(event) {
    event.preventDefault();
    const details = Object.fromEntries(Object.entries(draft)
      .map(([key, value]) => [key, value.trim()])
      .filter(([, value]) => value));
    onSave(details);
    setDraft(null);
  }

  return (
    <section className="card profile-details" aria-labelledby="personal-profile-heading">
      <h2 id="personal-profile-heading" className="text-heading-sm">Perfil personal</h2>
      <p>Los datos son opcionales y se guardan en este navegador. Puedes borrar un campo y guardar para retirarlo.</p>
      {draft ? (
        <form className="trip-form" onSubmit={save}>
          {sections.map(({ title, fields }) => (
            <fieldset key={title} className="profile-fields">
              <legend>{title}</legend>
              <div className="form-fields">
                {fields.map(({ key, label, type, country, autoComplete }) => country ? (
                  <CountrySelect key={key} id={key} label={label} value={draft[key]} onChange={(value) => change(key, value)} />
                ) : (
                  <div key={key} className="input-group">
                    <label className="input-label" htmlFor={key}>{label}</label>
                    <input className="input" id={key} type={type ?? "text"} autoComplete={autoComplete ?? "off"}
                      maxLength={type === "tel" ? 32 : 150} value={draft[key]}
                      pattern={type === "tel" ? "\\+[1-9][0-9 \\(\\)\\-]{5,29}" : undefined}
                      title={type === "tel" ? "Incluye el prefijo internacional, por ejemplo +51." : undefined}
                      onChange={(event) => change(key, event.target.value)} />
                  </div>
                ))}
              </div>
            </fieldset>
          ))}
          <div className="profile-actions">
            <button type="button" className="btn btn-outline" onClick={() => setDraft(null)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar perfil</button>
          </div>
        </form>
      ) : (
        <>
          {!hasDetails && <p>Aún no has añadido datos personales.</p>}
          {hasDetails && sections.map(({ title, fields }) => (
            <section key={title}>
              <h3>{title}</h3>
              <dl className="profile-summary">
                {fields.map(({ key, label }) => (
                  <div key={key}>
                    <dt>{label}</dt>
                    <dd>{profile?.[key] || "Sin indicar"}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
          <button type="button" className="btn btn-outline" onClick={startEditing}>Editar perfil</button>
        </>
      )}
    </section>
  );
}
