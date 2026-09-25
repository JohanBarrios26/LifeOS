"use client";

import { type FormEvent, useState } from "react";
import { Button, Field, formCardClassName, inputClassName } from "@/components/form";
import { createEntityFields, markUpdated } from "@/domain/entity";
import { cleanDisplayName, MAX_DISPLAY_NAME_LENGTH, PROFILE_ID, type Profile } from "@/domain/profile";
import { LOCAL_USER_ID } from "@/lib/preferences";

interface NameFormProps {
  /** The current profile when changing the name; undefined on the welcome step. */
  profile?: Profile;
  onSave: (profile: Profile) => Promise<void>;
  onCancel?: () => void;
}

export function NameForm({ profile, onSave, onCancel }: NameFormProps) {
  const [name, setName] = useState(profile?.displayName ?? "");
  const [saving, setSaving] = useState(false);

  async function save(displayName: string) {
    setSaving(true);
    const cleaned = cleanDisplayName(displayName);
    await onSave(
      profile
        ? markUpdated(profile, { displayName: cleaned })
        : { ...createEntityFields(LOCAL_USER_ID), id: PROFILE_ID, displayName: cleaned },
    );
    setSaving(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (cleanDisplayName(name)) {
      save(name);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={formCardClassName}>
      <h2 className="text-lg font-semibold">{profile ? "Tu nombre" : "¿Cómo quieres que te llamemos?"}</h2>

      <Field
        label="Nombre"
        htmlFor="profile-name"
        hint="Solo se usa para saludarte. Puedes cambiarlo cuando quieras."
      >
        <input
          id="profile-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={MAX_DISPLAY_NAME_LENGTH}
          placeholder="Ej: Camila"
          autoComplete="given-name"
          className={inputClassName}
        />
      </Field>

      <div className="flex gap-2">
        <Button type="submit" disabled={saving || !cleanDisplayName(name)} className="flex-1">
          {saving ? "Guardando…" : profile ? "Guardar" : "Continuar"}
        </Button>
        {profile ? (
          <Button variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => save("")} disabled={saving}>
            Prefiero no decirlo
          </Button>
        )}
      </div>
    </form>
  );
}
