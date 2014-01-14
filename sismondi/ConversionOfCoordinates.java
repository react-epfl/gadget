import java.io.*;
import java.util.ArrayList;

public class ConversionOfCoordinates
{
	public ConversionOfCoordinates(){

	}
	public void convert()
	{
		try{
			FileReader file = new FileReader("/Users/wissam/gadget/sismondi/test.txt");
			BufferedReader br = new BufferedReader(file);
			String line = new String();
			String delim = "[ ]+";
			String[] tokens;

			String[] t;
			Float[] x, y, z;

			ArrayList<String> list = new ArrayList<String>();
			//while(br.readLine()!=null){
				line = br.readLine();
				//System.out.println(line);
				tokens = line.split(delim);
				for(int i = 0; i<tokens.length;i++)
				{
					list.add(tokens[i]);
					// t[i] = ;
					// x[i] = ;
					// y[i] = ;
					// z[i] = ;
					System.out.println(list[i]);
				}
				//System.out.println(line);
			//}

		}catch(FileNotFoundException exception){
			System.out.println("File not in directroy");
		}catch(IOException io){
			System.out.println("Something wrong with IO");
		}
	}
public static void main(String args[])
	{
		System.out.println("Hello");
		ConversionOfCoordinates con = new ConversionOfCoordinates();
		con.convert();
	}
}