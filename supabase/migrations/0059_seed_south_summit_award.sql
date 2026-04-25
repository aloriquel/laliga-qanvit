-- 0059_seed_south_summit_award
--
-- Adds South Summit (Madrid editions) as the third award in the Hall of Fame.
-- Brazil/Korea/Bilbao editions are intentionally out of scope for V1.

INSERT INTO public.awards (
  slug,
  name,
  organizer,
  organizer_url,
  description,
  website_url,
  brand_color,
  scope,
  start_year,
  active
) VALUES (
  'south-summit',
  'South Summit Startup Competition',
  'South Summit · IE University',
  'https://www.southsummit.io',
  'Una de las principales competiciones de startups en Europa, organizada anualmente en Madrid desde 2013. Selecciona 100 finalistas de entre miles de candidaturas internacionales. Pasados ganadores incluyen Cabify, Wallbox, Spotahome, Glovo y JobandTalent. La edición Madrid es internacional pero con foco en el ecosistema español.',
  'https://www.southsummit.io/madrid/',
  '#FF6B35',
  'global',
  2013,
  true
)
ON CONFLICT (slug) DO NOTHING;
