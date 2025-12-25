/*
  # Add DELETE policy for events

  1. Security
    - Add policy for authenticated users to delete events from groovanna b table
    - This allows any authenticated user to delete any event
    - Can be refined later to restrict to event creators only
*/

CREATE POLICY "Allow authenticated users to delete events"
  ON "public"."groovanna b"
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING (true);