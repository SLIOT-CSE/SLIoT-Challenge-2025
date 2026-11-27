import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CategoryTiles } from "./category-tiles";
import { changeCategory } from "./form";
import type { StepProps } from "./step-props";

export function TeamStep({ values, error, touch, update }: StepProps) {
  return (
    <div className="flex flex-col gap-8">
      <Field
        label="Team name"
        helper=""
        error={error("name")}
        required
      >
        {(control) => (
          <Input
            {...control}
            value={values.name}
            maxLength={60}
            autoComplete="off"
            onChange={(e) => update((v) => ({ ...v, name: e.target.value }), ["name"])}
            onBlur={() => touch("name")}
          />
        )}
      </Field>

      <CategoryTiles
        value={values.category}
        error={error("category")}
        onChange={(id) => update((v) => changeCategory(v, id), ["category", "institutionName"])}
        onBlur={() => touch("category")}
      />
    </div>
  );
}
