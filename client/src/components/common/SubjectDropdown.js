import React, { useMemo } from 'react';
import CreatableSelect from 'react-select/creatable';

const SubjectDropdown = ({
  availableSubjects,
  selectedSubjects,
  onChangeSubjects,
  onCreateSubject,
  placeholder = 'Search or add subject...',
  isDisabled = false
}) => {
  const options = useMemo(
    () =>
      (availableSubjects || []).map((sub) => ({
        label: sub,
        value: sub
      })),
    [availableSubjects]
  );

  const value = useMemo(
    () => options.filter((opt) => (selectedSubjects || []).includes(opt.value)),
    [options, selectedSubjects]
  );

  const handleChange = (selected) => {
    const values = selected ? selected.map((s) => s.value) : [];
    onChangeSubjects(values);
  };

  const handleCreate = async (inputValue) => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    // If already exists, just select it
    if (availableSubjects.includes(trimmed)) {
      const merged = Array.from(new Set([...(selectedSubjects || []), trimmed]));
      onChangeSubjects(merged);
      return;
    }

    if (onCreateSubject) {
      try {
        const createdName = await onCreateSubject(trimmed);
        const nameToUse = createdName || trimmed;
        const merged = Array.from(
          new Set([...(selectedSubjects || []), nameToUse])
        );
        onChangeSubjects(merged);
      } catch (e) {
        // swallow, backend error should be handled in caller
      }
    } else {
      const merged = Array.from(new Set([...(selectedSubjects || []), trimmed]));
      onChangeSubjects(merged);
    }
  };

  const customStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: 'rgba(15,23,42,0.85)',
      borderColor: state.isFocused ? '#34d399' : 'rgba(148,163,184,0.4)',
      minHeight: 40,
      boxShadow: state.isFocused ? '0 0 0 1px rgba(52,211,153,0.6)' : 'none',
      '&:hover': {
        borderColor: '#34d399'
      }
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: 'rgba(15,23,42,0.98)',
      zIndex: 50
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: 'rgba(16,185,129,0.15)'
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: '#a7f3d0'
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: '#6ee7b7',
      ':hover': {
        backgroundColor: 'rgba(52,211,153,0.25)',
        color: '#ecfdf5'
      }
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? 'rgba(16,185,129,0.35)'
        : state.isFocused
        ? 'rgba(15,118,110,0.6)'
        : 'transparent',
      color: '#e5e7eb',
      ':active': {
        backgroundColor: 'rgba(16,185,129,0.45)'
      }
    }),
    placeholder: (base) => ({
      ...base,
      color: '#9ca3af'
    }),
    input: (base) => ({
      ...base,
      color: '#e5e7eb'
    }),
    singleValue: (base) => ({
      ...base,
      color: '#e5e7eb'
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 })
  };

  return (
    <CreatableSelect
      isMulti
      isDisabled={isDisabled}
      options={options}
      value={value}
      onChange={handleChange}
      onCreateOption={handleCreate}
      placeholder={placeholder}
      classNamePrefix="subject-select"
      styles={customStyles}
      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
    />
  );
};

export default SubjectDropdown;

