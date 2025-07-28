import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
  );
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to generate TypeScript types from Supabase schema
async function generateTypes() {
  try {
    // Fetch table information from Supabase
    const { data: tables, error: tablesError } =
      await supabase.rpc('get_public_tables');

    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
      process.exit(1);
    }

    // Generate TypeScript interface for each table
    let typesContent = '// Auto-generated Supabase types\n\n';
    typesContent += 'export type Database = {\n  public: {\n    Tables: {\n';

    for (const table of tables) {
      const { data: columns, error: columnsError } = await supabase.rpc(
        'get_table_columns',
        { table_name: table.table_name }
      );

      if (columnsError) {
        console.error(
          `Error fetching columns for ${table.table_name}:`,
          columnsError
        );
        continue;
      }

      typesContent += `      ${table.table_name}: {\n`;
      typesContent += '        Row: {\n';

      for (const column of columns) {
        const nullable = column.is_nullable === 'YES';
        const type = mapDataType(column.data_type, nullable);
        typesContent += `          ${column.column_name}: ${type};\n`;
      }

      typesContent += '        };\n';
      typesContent += '        Insert: {\n';

      for (const column of columns) {
        const nullable = column.is_nullable === 'YES';
        const type = mapDataType(column.data_type, nullable);
        // Make all fields optional for Insert type
        typesContent += `          ${column.column_name}?: ${type};\n`;
      }

      typesContent += '        };\n';
      typesContent += '        Update: {\n';

      for (const column of columns) {
        const nullable = column.is_nullable === 'YES';
        const type = mapDataType(column.data_type, nullable);
        // Make all fields optional for Update type
        typesContent += `          ${column.column_name}?: ${type};\n`;
      }

      typesContent += '        };\n';
      typesContent += '      };\n';
    }

    typesContent += '    };\n  };\n};\n';

    // Write types to file
    fs.writeFileSync('src/lib/supabase-types.ts', typesContent);
    console.log('✅ Supabase types generated successfully!');
  } catch (error) {
    console.error('Error generating types:', error);
    process.exit(1);
  }
}

// Map PostgreSQL data types to TypeScript types
function mapDataType(pgType: string, nullable: boolean): string {
  let tsType: string;

  switch (pgType) {
    case 'integer':
    case 'bigint':
    case 'smallint':
    case 'serial':
    case 'bigserial':
      tsType = 'number';
      break;
    case 'text':
    case 'varchar':
    case 'char':
    case 'uuid':
    case 'timestamp with time zone':
    case 'timestamp without time zone':
    case 'date':
      tsType = 'string';
      break;
    case 'boolean':
      tsType = 'boolean';
      break;
    case 'json':
    case 'jsonb':
      tsType = 'any';
      break;
    default:
      tsType = 'any';
      console.warn(`Unknown PostgreSQL type: ${pgType}`);
  }

  return nullable ? `${tsType} | null` : tsType;
}

// Run the type generation
generateTypes();
