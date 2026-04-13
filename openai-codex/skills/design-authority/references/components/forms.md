# Forms

## Text Input

```
w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-950 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-primary-light focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950
```

## Textarea

Same as text input, plus:

```
min-h-[80px] resize-y
```

## Select

Same as text input, plus:

```
appearance-none
```

Add a chevron icon (lucide-react `ChevronDown`) positioned absolutely inside the container.

## FormField Wrapper

```tsx
<div className="space-y-1.5">
  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
    {label}
  </label>
  {/* input goes here */}
  <p className="text-xs text-gray-500 dark:text-gray-500">
    {helperText}
  </p>
</div>
```

## Error State

Border: `border-red-500 dark:border-red-400`

Error message: `<p className="text-xs text-red-600 dark:text-red-400">`

## Disabled State

```
opacity-50 cursor-not-allowed
```

Applied to the input element. Do not dim the label.
