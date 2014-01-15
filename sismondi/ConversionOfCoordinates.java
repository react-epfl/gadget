import java.io.*;
import java.util.ArrayList;
import java.lang.Math;

public class ConversionOfCoordinates
{
	public ConversionOfCoordinates(){

	}
	public void convert()
	{
		double a = Math.sqrt(2)/2;
		double b = Math.sqrt(2/3);
		double c = 1/(Math.sqrt(6));

		try{
			FileReader file = new FileReader("/Users/wissam/gadget/sismondi/satellite3d.txt");
			PrintWriter writer = new PrintWriter("/Users/wissam/gadget/sismondi/satellite2d.txt");
			BufferedReader br = new BufferedReader(file);
			String line = new String();//br.readLine();
			String delim = "[ ]+";

			//Parameters from the file
			ArrayList<String> t = new ArrayList<String>();
			ArrayList<Double> x = new ArrayList<Double>();
			ArrayList<Double> y = new ArrayList<Double>();
			ArrayList<Double> z = new ArrayList<Double>();

			//New coordinates
			ArrayList<Double> x_n = new ArrayList<Double>();
			ArrayList<Double> y_n = new ArrayList<Double>();

			//line = br.readLine();
			while((line = br.readLine())!=null){
				String[] tokens = line.split(delim);
				// System.out.println(line);
				t.add(tokens[0]);
				x.add(Double.parseDouble(tokens[1]));
				y.add(Double.parseDouble(tokens[2]));
				z.add(Double.parseDouble(tokens[3]));
				//line = br.readLine();
			}

			for(int i=0;i<t.size();i++){	
				float xn = (float)(a*(x.get(i) - y.get(i)));
				float yn = (float)(b*z.get(i) - c*(x.get(i) + y.get(i)));
				writer.print(t.get(i) + " " + xn + " " + yn + "\n");
			}
			writer.close();
			br.close();

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