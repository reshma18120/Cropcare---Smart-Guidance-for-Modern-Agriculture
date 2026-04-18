import { useState } from "react";
import { Country, State, City } from "country-state-city";

interface Props {
  onSelect: (region: string) => void;
}

export default function LocationSelector({ onSelect }: Props) {
  const [countryCode, setCountryCode] = useState("");
  const [stateCode, setStateCode] = useState("");

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* COUNTRY */}
      <select
        className="border rounded-xl px-4 py-3"
        onChange={(e) => {
          setCountryCode(e.target.value);
          setStateCode("");
        }}
      >
        <option>Select Country</option>
        {Country.getAllCountries().map((c) => (
          <option key={c.isoCode} value={c.isoCode}>
            {c.name}
          </option>
        ))}
      </select>

      {/* STATE */}
      <select
        className="border rounded-xl px-4 py-3"
        disabled={!countryCode}
        onChange={(e) => setStateCode(e.target.value)}
      >
        <option>Select State</option>
        {State.getStatesOfCountry(countryCode).map((s) => (
          <option key={s.isoCode} value={s.isoCode}>
            {s.name}
          </option>
        ))}
      </select>

      {/* CITY */}
      <select
        className="border rounded-xl px-4 py-3"
        disabled={!stateCode}
        onChange={(e) => {
          const city = e.target.value;
          const country = Country.getCountryByCode(countryCode)?.name;
          const state = State.getStateByCodeAndCountry(stateCode, countryCode)?.name;
          onSelect(`${city}, ${state}, ${country}`);
        }}
      >
        <option>Select City</option>
        {City.getCitiesOfState(countryCode, stateCode).map((c) => (
          <option key={c.name}>{c.name}</option>
        ))}
      </select>
    </div>
  );
}
